pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[url: 'https://github.com/semyonfox/artificial.git']]
        ])
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'corepack enable'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Build') {
      steps {
        sh 'pnpm run build'
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}
